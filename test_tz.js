import getDb from './lib/db.js';

const db = getDb();
const result = db.prepare("SELECT datetime('now') as utc, datetime('now', 'localtime') as local, date('now', 'localtime') as local_date").get();
console.log('UTC:', result.utc);
console.log('Local:', result.local);
console.log('Local Date:', result.local_date);
console.log('JS New Date ISO:', new Date().toISOString());
console.log('JS New Date Local:', new Date().toLocaleString());
