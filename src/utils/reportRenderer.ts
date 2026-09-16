// Renders template HTML into a PNG image or PDF using Puppeteer.
// - PNG: full-page screenshot, compressed with sharp to stay under 5MB (WhatsApp image limit)
// - PDF: A4 pages, kept under 16MB (WhatsApp document limit)
// Files are written to a public folder and a public URL is returned.

import puppeteer, { Browser } from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import https from 'https';
import logger from '../config/logger.js';

const WHATSAPP_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const WHATSAPP_PDF_MAX_BYTES = 16 * 1024 * 1024; // 16MB

// Render width tuned for the 600px email container (2x for retina sharpness)
const RENDER_WIDTH = 640;
const DEVICE_SCALE = 2;

// Public folder + base URL for generated media
const MEDIA_DIR = process.env.MEDIA_STORAGE_DIR || path.resolve(process.cwd(), 'public', 'reports');
const MEDIA_PUBLIC_BASE = (process.env.MEDIA_PUBLIC_BASE_URL || 'http://localhost:3002/reports').replace(/\/+$/, '');

// Reuse a single browser instance across requests (faster, less memory churn)
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    browserPromise.then((b) => {
      b.on('disconnected', () => { browserPromise = null; });
    }).catch(() => { browserPromise = null; });
  }
  return browserPromise;
}

// Current month subfolder name, e.g. "2026-09". Reports are grouped per month.
function currentMonthFolder(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

// Ensure the month subfolder under MEDIA_DIR exists and return its absolute path.
async function ensureMediaDir(): Promise<string> {
  const monthDir = path.join(MEDIA_DIR, currentMonthFolder());
  await fs.mkdir(monthDir, { recursive: true });
  return monthDir;
}

export interface RenderResult {
  ok: boolean;
  publicUrl?: string;
  filePath?: string;
  fileName?: string;
  bytes?: number;
  error?: string;
}

// Build an industry-standard, safe file name.
// e.g. "Netsights-Report_Celebrity-Drapes_2026-09-10_a1b2c3d4.pdf"
function buildFileName(ext: string, hint?: string): string {
  const datePart = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const shortId = randomUUID().slice(0, 8);
  let slug = 'Report';
  if (hint && hint.trim()) {
    slug = hint.trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // drop unsafe chars
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) || 'Report';
  }
  return `Netsights-Report_${slug}_${datePart}_${shortId}.${ext}`;
}

// Puppeteer's PDF header/footer templates render in an isolated context that does
// NOT reliably load external images. So we fetch the logo once and cache it as a
// base64 data URI — this always renders inside the header.
const LOGO_URL = 'https://app.netsights.ai/images/logo/netsight-Black.svg';
let cachedLogoDataUri: string | null = null;

function fetchLogoDataUri(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      https
        .get(LOGO_URL, (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            resolve(null);
            return;
          }
          const contentType = res.headers['content-type'] || 'image/svg+xml';
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c as Buffer));
          res.on('end', () => {
            const b64 = Buffer.concat(chunks).toString('base64');
            resolve(`data:${contentType};base64,${b64}`);
          });
        })
        .on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

async function getLogoDataUri(): Promise<string> {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const uri = await fetchLogoDataUri();
  // Fall back to the remote URL if fetch failed (better than nothing).
  cachedLogoDataUri = uri || LOGO_URL;
  return cachedLogoDataUri;
}

// Shared: repeating per-page header (logo + green line) and footer (copyright,
// support links, page number). Uses Puppeteer displayHeaderFooter templates.
function buildHeaderTemplate(logoSrc: string): string {
  return `
    <div style="width:100%; -webkit-print-color-adjust:exact; print-color-adjust:exact; padding:0 12px; box-sizing:border-box;">
      <div style="text-align:center; padding:6px 0 8px 0; border-bottom:3px solid #5DBBB8;">
        <img src="${logoSrc}" style="height:26px;" />
      </div>
    </div>
  `;
}

function buildFooterTemplate(): string {
  // Puppeteer injects .pageNumber / .totalPages spans automatically.
  return `
    <div style="width:100%; font-family:Arial,Helvetica,sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact; padding:0 12px; box-sizing:border-box;">
      <div style="border-top:1px solid #e5e7eb; padding-top:6px; text-align:center; color:#6b7280; font-size:9px; line-height:1.5;">
        <div>&copy; ${new Date().getFullYear()} Netsights.ai. All rights reserved</div>
        <div style="margin-top:2px;">
          <a href="https://netsights.ai/support/" style="color:#5DBBB8; text-decoration:none;">Support</a>
          &nbsp;|&nbsp;
          <a href="https://netsights.ai/contact-us/" style="color:#5DBBB8; text-decoration:none;">Contact Us</a>
        </div>
        <div style="margin-top:2px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>
    </div>
  `;
}

// Render HTML into a PNG. Compresses to stay under 5MB.
export async function renderHtmlToImage(html: string, fileNameHint?: string): Promise<RenderResult> {
  let page;
  try {
    const monthDir = await ensureMediaDir();
    const monthFolder = currentMonthFolder();
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: RENDER_WIDTH, height: 800, deviceScaleFactor: DEVICE_SCALE });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 400));

    const rawPng = (await page.screenshot({ type: 'png', fullPage: true })) as Buffer;

    let output = await sharp(rawPng).png({ compressionLevel: 9, quality: 90 }).toBuffer();
    if (output.length > WHATSAPP_IMAGE_MAX_BYTES) {
      let quality = 85;
      const meta = await sharp(rawPng).metadata();
      const targetWidth = meta.width ? Math.min(meta.width, 1080) : 1080;
      do {
        output = await sharp(rawPng).resize({ width: targetWidth }).jpeg({ quality, mozjpeg: true }).toBuffer();
        quality -= 10;
      } while (output.length > WHATSAPP_IMAGE_MAX_BYTES && quality >= 40);
    }

    const isJpeg = output[0] === 0xff && output[1] === 0xd8;
    const ext = isJpeg ? 'jpg' : 'png';
    const fileName = buildFileName(ext, fileNameHint);
    const filePath = path.join(monthDir, fileName);
    await fs.writeFile(filePath, output);

    const publicUrl = `${MEDIA_PUBLIC_BASE}/${monthFolder}/${fileName}`;
    logger.info('Report image rendered', { fileName, monthFolder, bytes: output.length, publicUrl });
    return { ok: true, publicUrl, filePath, fileName, bytes: output.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('renderHtmlToImage failed', { error: msg });
    return { ok: false, error: msg };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// Render HTML into a PDF. Kept under 16MB.
export async function renderHtmlToPdf(html: string, fileNameHint?: string): Promise<RenderResult> {
  let page;
  try {
    const monthDir = await ensureMediaDir();
    const monthFolder = currentMonthFolder();
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: RENDER_WIDTH, height: 800, deviceScaleFactor: DEVICE_SCALE });
    // Always render light (never trigger the template dark-mode CSS).
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

    // Print CSS:
    // - Small boxes (.highlight/.review/.inventory) keep their SINGLE box and jump whole.
    // - Big ".layer" sections split across pages via the table<thead> trick (header repeats),
    //   with cells carrying the box so each page fragment closes/reopens cleanly.
    // - The in-body header + in-body footer are hidden (we use repeating PDF header/footer).
    const printCss = `
      <style>
        @media print {
          /* small boxes: single box, never split. Add bottom gap to match .layer chunks. */
          .highlight, .review, .inventory { break-inside: avoid; page-break-inside: avoid; margin-bottom: 24px !important; }
          /* one ad-account row: keep together */
          .metrics-table { break-inside: avoid; page-break-inside: avoid; }
          /* hide in-body header (repeating PDF header used instead) */
          .header { display: none !important; }
          .footer { background: transparent !important; border-top: none !important; padding-top: 4px !important; }
        }
        /* Split ".layer" loses its own box; each computed CHUNK is a self-contained
           rounded box (top AND bottom radius) rendered by JS bin-packing below.
           No table / thead / box-decoration-break — those were unreliable for radius. */
        .layer.is-split { background:transparent !important; border:none !important; padding:0 !important; border-radius:0 !important; margin:0 !important; }

        .layer-chunk {
          border-radius: 14px;
          border-left: 4px solid #6366f1;
          padding: 15px;
          margin-bottom: 24px;               /* clean gap so nothing hugs the footer */
          overflow: hidden;
          background-clip: padding-box;
          break-inside: avoid; page-break-inside: avoid;   /* a chunk is atomic */
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        /* Continuation chunks start on a fresh page (set inline by JS too). */
        .layer-chunk.chunk-break { break-before: page; page-break-before: always; }
        .layer-chunk-header { margin-bottom: 10px; }

        .layer-chunk.teal   { background:#ecfeff; border-left-color:#5eead4; }
        .layer-chunk.pink   { background:#fdf2f8; border-left-color:#f9a8d4; }
        .layer-chunk.indigo { background:#eef2ff; border-left-color:#c7d2fe; }

        .account-block { break-inside: avoid; page-break-inside: avoid; }

        a.footer-btn-link:hover, a[href*="netsights.ai"]:hover { background-color:#4da9a6 !important; color:#ffffff !important; }
      </style>
    `;
    const htmlForPdf = html.includes('</head>') ? html.replace('</head>', printCss + '</head>') : printCss + html;
    await page.setContent(htmlForPdf, { waitUntil: 'load', timeout: 30000 });

    // -- Measured bin-packing pagination for big ".layer" sections --
    // Instead of relying on Chromium auto-splitting a table/tbody (which breaks
    // rounded corners at the cut point), we MEASURE each content block and group them
    // into page-sized chunks. Each chunk is rendered as its own self-contained rounded
    // box with a repeated header + explicit page-break -- so border-radius is always
    // correct on both ends and nothing hugs the footer.
    const PDF_MARGIN_TOP_PX = 70;    // matches page.pdf margin.top
    const PDF_MARGIN_BOTTOM_PX = 60; // matches page.pdf margin.bottom
    const PAGE_SAFETY_BUFFER_PX = 28; // keep content clear of the footer

    const paginateFn = `(cfg) => {
      var A4_HEIGHT_PX = 1123; // A4 @ 96dpi
      var usable = A4_HEIGHT_PX - cfg.marginTop - cfg.marginBottom - cfg.safety;
      var CHUNK_GAP = 24; // matches .layer-chunk margin-bottom

      // Track cumulative document height already consumed (running fill of the page flow).
      // Non-.layer content (intro text, small boxes) also consumes space, so we measure
      // each top-level flow element's real height and advance runningY as we go.
      var container = document.querySelector('.content') || document.body;

      // We only reflow ".layer" sections; everything else keeps natural flow.
      // To know where a section STARTS on its page, we measure the live offsetTop
      // of the layer relative to the container BEFORE transforming it, and reduce
      // it modulo the page height to get the position within the current page.
      var containerTop = container.getBoundingClientRect().top;

      var layers = Array.prototype.slice.call(document.querySelectorAll('.layer'));
      layers.forEach(function (layer) {
        var header = layer.querySelector('.layer-header');
        if (!header) return;
        var variant = layer.classList.contains('teal') ? 'teal'
                    : layer.classList.contains('pink') ? 'pink'
                    : layer.classList.contains('indigo') ? 'indigo' : '';

        // Where does this section currently start, measured from the top of the flow?
        var layerTopAbs = layer.getBoundingClientRect().top - containerTop;
        // Position within the current page (how much of the page is already used above it).
        var usedOnThisPage = ((layerTopAbs % usable) + usable) % usable;
        var remainingOnFirstPage = usable - usedOnThisPage;

        var blocks = [];
        layer.childNodes.forEach(function (n) {
          if (n === header) return;
          if (n.nodeType === 3 && !String(n.textContent).trim()) return;
          if (n.nodeType === 1 && n.tagName === 'DIV' && n.querySelector && n.querySelector('.layer-header')) {
            n.childNodes.forEach(function (c) {
              if (c.nodeType === 3 && !String(c.textContent).trim()) return;
              if (c.nodeType === 1) blocks.push(c);
            });
          } else if (n.nodeType === 1) {
            blocks.push(n);
          }
        });

        var layerWidth = layer.getBoundingClientRect().width;

        function buildChunk(blockEls) {
          var chunk = document.createElement('div');
          chunk.className = 'layer-chunk' + (variant ? ' ' + variant : '');
          var h = header.cloneNode(true);
          h.classList.add('layer-chunk-header');
          chunk.appendChild(h);
          blockEls.forEach(function (b) {
            var wrap = document.createElement('div');
            wrap.className = 'account-block';
            wrap.appendChild(b);
            chunk.appendChild(wrap);
          });
          return chunk;
        }

        // Measure header height (empty chunk).
        var probe = buildChunk([]);
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.width = layerWidth + 'px';
        document.body.appendChild(probe);
        var headerH = probe.getBoundingClientRect().height;
        document.body.removeChild(probe);

        // Measure each block height inside a chunk-styled container.
        var measurer = document.createElement('div');
        measurer.className = 'layer-chunk' + (variant ? ' ' + variant : '');
        measurer.style.position = 'absolute';
        measurer.style.visibility = 'hidden';
        measurer.style.width = layerWidth + 'px';
        document.body.appendChild(measurer);
        var blockHeights = blocks.map(function (b) {
          var w = document.createElement('div');
          w.className = 'account-block';
          w.appendChild(b.cloneNode(true));
          measurer.appendChild(w);
          var hgt = w.getBoundingClientRect().height;
          measurer.removeChild(w);
          return hgt;
        });
        document.body.removeChild(measurer);

        // Bin-pack. The FIRST chunk uses whatever space remains on the current page
        // (remainingOnFirstPage). Subsequent chunks use a full page (usable).
        // A chunk always includes the header, so its budget = capacity - headerH.
        // If the first-page remaining space can't even fit header + 1 block, that
        // first chunk will simply be small/empty of blocks -> we instead start the
        // section fresh on a new page (chunk-break) to avoid an ugly stub.
        var chunks = [];
        var chunkStartsNewPage = []; // parallel array: does chunk[i] force a page break?

        var firstCapacity = remainingOnFirstPage;
        // If not enough room on the current page for header + first block, start on next page.
        var startFresh = false;
        if (blocks.length > 0 && (headerH + blockHeights[0] + CHUNK_GAP) > firstCapacity) {
          startFresh = true;
          firstCapacity = usable;
        } else if (blocks.length === 0 && (headerH + CHUNK_GAP) > firstCapacity) {
          startFresh = true;
          firstCapacity = usable;
        }

        var current = [];
        var runningH = headerH;
        var capacity = firstCapacity;
        var isFirstChunk = true;
        for (var i = 0; i < blocks.length; i++) {
          var bh = blockHeights[i];
          if (current.length > 0 && (runningH + bh + CHUNK_GAP) > capacity) {
            chunks.push(current);
            chunkStartsNewPage.push(isFirstChunk ? startFresh : true);
            isFirstChunk = false;
            current = [];
            runningH = headerH;
            capacity = usable; // subsequent chunks get a full page
          }
          current.push(blocks[i]);
          runningH += bh;
        }
        if (current.length > 0 || chunks.length === 0) {
          chunks.push(current);
          chunkStartsNewPage.push(isFirstChunk ? startFresh : true);
        }

        header.remove();
        layer.classList.add('is-split');
        while (layer.firstChild) layer.removeChild(layer.firstChild);

        chunks.forEach(function (blockEls, idx) {
          var chunk = buildChunk(blockEls);
          if (chunkStartsNewPage[idx]) chunk.classList.add('chunk-break');
          layer.appendChild(chunk);
        });
      });

      var footer = document.querySelector('.footer');
      if (footer) {
        footer.querySelectorAll('p').forEach(function (p) { p.remove(); });
        var tables = footer.querySelectorAll('table');
        if (tables.length > 1) tables[tables.length - 1].remove();
      }
    }`;
    var paginateCfg = JSON.stringify({ marginTop: PDF_MARGIN_TOP_PX, marginBottom: PDF_MARGIN_BOTTOM_PX, safety: PAGE_SAFETY_BUFFER_PX });
    await (page as any).evaluate("(" + paginateFn + ")(" + paginateCfg + ")");
    await new Promise((r) => setTimeout(r, 400));

    // Resolve the logo as a base64 data URI so the repeating PDF header shows it.
    const logoSrc = await getLogoDataUri();

    const pdfBuffer = (await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: buildHeaderTemplate(logoSrc),
      footerTemplate: buildFooterTemplate(),
      // Room for repeating header (top) and footer (bottom).
      margin: { top: '70px', bottom: '60px', left: '12px', right: '12px' },
    })) as Buffer;

    if (pdfBuffer.length > WHATSAPP_PDF_MAX_BYTES) {
      return { ok: false, error: `Generated PDF (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB) exceeds WhatsApp 16MB limit.` };
    }

    const fileName = buildFileName('pdf', fileNameHint);
    const filePath = path.join(monthDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    const publicUrl = `${MEDIA_PUBLIC_BASE}/${monthFolder}/${fileName}`;
    logger.info('Report PDF rendered', { fileName, monthFolder, bytes: pdfBuffer.length, publicUrl });
    return { ok: true, publicUrl, filePath, fileName, bytes: pdfBuffer.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('renderHtmlToPdf failed', { error: msg });
    return { ok: false, error: msg };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}














