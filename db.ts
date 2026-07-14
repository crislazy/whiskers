import sqlite3 from "sqlite3";

const db = new sqlite3.Database("option-storage.db");

// Stores features
db.run(`
CREATE TABLE IF NOT EXISTS options (
    option TEXT PRIMARY KEY,
    status TEXT NOT NULL
);
`);

// Stores the prefix
db.run(`
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
`);

export function getFeature(option: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT status FROM options WHERE option = ?",
      [option],
      (err: Error | null, row: { status: string } | undefined) => {
        if (err) reject(err);
        else resolve(row ? row.status : null);
      }
    );
  });
}

export function saveFeature(option: string, status: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO options (option, status)
       VALUES (?, ?)`,
      [option, status],
      (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function deleteFeature(option: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM options WHERE option = ?",
      [option],
      (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function getConfig(key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT value FROM config WHERE key = ?",
      [key],
      (err: Error | null, row: { value: string } | undefined) => {
        if (err) reject(err);
        else resolve(row ? row.value : null);
      }
    );
  });
}

export function setConfig(key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO config (key, value)
       VALUES (?, ?)`,
      [key, value],
      (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function statusFeature(feature: string): Promise<void|boolean> {
    const value = await getFeature(feature)
    if (value === "enabled"){
        return true
    } else if (value === "disabled"){
        return false
    } else if (value === null) {
        await saveFeature(feature, "enabled");
        return true
    }
    return false;

}