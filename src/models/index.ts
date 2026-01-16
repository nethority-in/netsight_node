// Import models
import { NotificationLog } from './NotificationLog.js';
import { NotificationSetting } from './NotificationSetting.js';
import { Widget } from './Widget.js';

// COMMENTED OUT: User and Post associations (not needed for now)
// User.hasMany(Post, {
//   foreignKey: 'userId',
//   as: 'posts'
// });
// Post.belongsTo(User, {
//   foreignKey: 'userId',
//   as: 'user'
// });

// Export all models
export { NotificationLog, NotificationSetting, Widget };
