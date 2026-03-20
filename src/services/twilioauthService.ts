import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByUsername,
  comparePassword,
  updateUserApiKey,
  generateApiKey,
  StoredUser,
} from "./twiliouserService.js";
import { appendAuthLog } from "../utils/logApiResponse.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export interface AuthUser {
  id: string;
  username: string;
}

export type RegisterResult =
  | {
      ok: true;
      token: string;
      apiKey: string;
      user: AuthUser;
      storageHint: string;
    }
  | {
      ok: false;
      alreadyExists: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      status?: number;
    };

export type LoginResult =
  | {
      ok: true;
      token: string;
      apiKey: string;
      user: AuthUser;
      storageHint: string;
    }
  | {
      ok: false;
      message: string;
      status?: number;
    };

function toAuthUser(u: StoredUser): AuthUser {
  return { id: u.id, username: u.username };
}

function signToken(payload: AuthUser): string {
  if (!JWT_SECRET || JWT_SECRET.trim() === "") {
    throw new Error("JWT_SECRET is not set in .env");
  }
  return jwt.sign(payload, JWT_SECRET.trim(), {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export async function register(
  username: string,
  password: string,
): Promise<RegisterResult> {
  try {
    const result = await createUser(username, password);
    if ("alreadyExists" in result && result.alreadyExists) {
      appendAuthLog({
        event: "register_attempt",
        username: username.trim(),
        success: false,
        message: "User already exists",
      });
      return {
        ok: false,
        alreadyExists: true,
        message: "User already exists. Use login instead.",
      };
    }
    if (!("user" in result)) throw new Error("Unexpected");
    const user = toAuthUser(result.user);
    const token = signToken(user);
    const apiKey = result.user.apiKey ?? "";
    appendAuthLog({
      event: "register",
      username: user.username,
      success: true,
      userId: user.id,
    });
    return {
      ok: true,
      token,
      apiKey,
      user,
      storageHint:
        "Store token in sessionStorage (logout on tab close) or localStorage (persist). Do not store password.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    appendAuthLog({
      event: "register_error",
      username: username.trim(),
      success: false,
      message,
    });
    return { ok: false, message, status: 400 };
  }
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  const normalized = username.trim();
  if (!normalized || !password) {
    return {
      ok: false,
      message: "Username and password are required",
      status: 400,
    };
  }
  const user = await findUserByUsername(normalized);
  if (!user) {
    appendAuthLog({
      event: "login_attempt",
      username: normalized,
      success: false,
      message: "User not found",
    });
    return { ok: false, message: "Invalid username or password", status: 401 };
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    appendAuthLog({
      event: "login_attempt",
      username: normalized,
      success: false,
      message: "Invalid password",
    });
    return { ok: false, message: "Invalid username or password", status: 401 };
  }
  let apiKey = user.apiKey;
  if (!apiKey) {
    apiKey = generateApiKey();
    await updateUserApiKey(user.id, apiKey);
  }
  const authUser = toAuthUser(user);
  const token = signToken(authUser);
  appendAuthLog({
    event: "login",
    username: authUser.username,
    success: true,
    userId: authUser.id,
  });
  return {
    ok: true,
    token,
    apiKey,
    user: authUser,
    storageHint:
      "Store token in sessionStorage (recommended) or localStorage. Store username only if needed; never store password.",
  };
}

export function verifyToken(token: string): AuthUser | null {
  if (!JWT_SECRET || JWT_SECRET.trim() === "") return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET.trim()) as AuthUser;
    return decoded && decoded.id && decoded.username ? decoded : null;
  } catch {
    return null;
  }
}
