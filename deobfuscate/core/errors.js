/**
 * YouTube Player Error Classes
 *
 * Deobfuscated from base.js
 * Source lines: 67161-67167 (PlayerError), 67267-67334 (IdbKnownError, MissingObjectStoresError),
 *              67336-67343 (IndexError), 73005-73011 (FetchError)
 */
import { setPrototypeOf } from './polyfills.js';

/**
 * IDB error message definitions.
 * [was: InW]
 */
export const IDB_ERROR_MESSAGES = {
  AUTH_INVALID: "No user identifier specified.",
  EXPLICIT_ABORT: "Transaction was explicitly aborted.",
  IDB_NOT_SUPPORTED: "IndexedDB is not supported.",
  MISSING_INDEX: "Index not created.",
  MISSING_OBJECT_STORES: "Object stores not created.",
  DB_DELETED_BY_MISSING_OBJECT_STORES: "Database is deleted because expected object stores were not created.",
  DB_REOPENED_BY_MISSING_OBJECT_STORES: "Database is reopened because expected object stores were not created.",
  UNKNOWN_ABORT: "Transaction was aborted for unknown reasons.",
  QUOTA_EXCEEDED: "The current transaction exceeded its quota limitations.",
  QUOTA_MAYBE_EXCEEDED: "The current transaction may have failed because of exceeding quota limitations.",
  EXECUTE_TRANSACTION_ON_CLOSED_DB: "Can't start a transaction on a closed database",
  INCOMPATIBLE_DB_VERSION: "The binary is incompatible with the database version",
};

/**
 * IDB error severity levels.
 * [was: XgK]
 */
export const IDB_ERROR_SEVERITY = {
  AUTH_INVALID: "ERROR",
  EXECUTE_TRANSACTION_ON_CLOSED_DB: "WARNING",
  EXPLICIT_ABORT: "IGNORED",
  IDB_NOT_SUPPORTED: "ERROR",
  MISSING_INDEX: "WARNING",
  MISSING_OBJECT_STORES: "ERROR",
  DB_DELETED_BY_MISSING_OBJECT_STORES: "WARNING",
  DB_REOPENED_BY_MISSING_OBJECT_STORES: "WARNING",
  QUOTA_EXCEEDED: "WARNING",
  QUOTA_MAYBE_EXCEEDED: "WARNING",
  UNKNOWN_ABORT: "WARNING",
  INCOMPATIBLE_DB_VERSION: "WARNING",
};

/**
 * IDB error "is software" flags -- indicates whether the error may be
 * caused by a transient/software issue rather than a hard failure.
 * [was: Ae7]
 */
export const IDB_ERROR_IS_TRANSIENT = {
  AUTH_INVALID: false,
  EXECUTE_TRANSACTION_ON_CLOSED_DB: false,
  EXPLICIT_ABORT: false,
  IDB_NOT_SUPPORTED: false,
  MISSING_INDEX: false,
  MISSING_OBJECT_STORES: false,
  DB_DELETED_BY_MISSING_OBJECT_STORES: false,
  DB_REOPENED_BY_MISSING_OBJECT_STORES: false,
  QUOTA_EXCEEDED: false,
  QUOTA_MAYBE_EXCEEDED: true,
  UNKNOWN_ABORT: true,
  INCOMPATIBLE_DB_VERSION: false,
};

/**
 * Known IDB error messages that indicate a closed database connection.
 * [was: NDm]
 */
export const CLOSED_DB_ERROR_MESSAGES = [
  "The database connection is closing",
  "Can't start a transaction on a closed database",
  "A mutation operation was attempted on a database that createSha1 not allow mutations",
];

/**
 * Base player error class. Extends native Error with additional arguments.
 * [was: g.H8]
 *
 * @extends Error
 */
export class PlayerError extends Error {
  /**
   * @param {string} message - Error message
   * @param {...*} args - Additional error arguments (error codes, details, etc.)
   */
  constructor(message, ...args) {
    super(message);
    /** @type {Array<*>} Additional error arguments */
    this.args = [...args];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Known IndexedDB error with type, severity, and transient flag.
 * [was: g.fg]
 *
 * @extends PlayerError
 */
export class IdbKnownError extends PlayerError {
  /**
   * @param {string} type - Error type key from IDB_ERROR_MESSAGES
   * @param {Object} [details={}] - Additional error details
   * @param {string} [message] - Error message (defaults to IDB_ERROR_MESSAGES[type])
   * @param {string} [level] - Severity level (defaults to IDB_ERROR_SEVERITY[type])
   * @param {boolean} [isTransient] - Whether error is transient (defaults to IDB_ERROR_IS_TRANSIENT[type])
   */
  constructor(
    type,
    details = {},
    message = IDB_ERROR_MESSAGES[type],
    level = IDB_ERROR_SEVERITY[type],
    isTransient = IDB_ERROR_IS_TRANSIENT[type]
  ) {
    super(message, {
      name: "YtIdbKnownError",
      isSw: self.document === undefined,
      isIframe: self !== self.top,
      type,
      ...details,
    });

    /** @type {string} Error type key */
    this.type = type;

    /** @type {string} Human-readable error message */
    this.message = message;

    /** @type {string} Severity level: "ERROR" | "WARNING" | "IGNORED" */
    this.level = level;

    /**
     * Whether this error may be caused by a transient/software issue.
     * [was: this.W]
     * @type {boolean}
     */
    this.isTransient = isTransient;

    Object.setPrototypeOf(this, IdbKnownError.prototype);
  }
}

/**
 * Error thrown when expected IDB object stores are missing.
 * [was: eVd]
 *
 * @extends IdbKnownError
 */
export class MissingObjectStoresError extends IdbKnownError {
  /**
   * @param {Array<string>} foundObjectStores - Object stores actually found in the DB
   * @param {Array<string>} expectedObjectStores - Object stores that were expected
   */
  constructor(foundObjectStores, expectedObjectStores) {
    super(
      "MISSING_OBJECT_STORES",
      {
        expectedObjectStores,
        foundObjectStores,
      },
      IDB_ERROR_MESSAGES.MISSING_OBJECT_STORES
    );
    Object.setPrototypeOf(this, MissingObjectStoresError.prototype);
  }
}

/**
 * Error thrown when an expected IDB index is missing from an object store.
 * [was: aC]
 *
 * @extends Error
 */
export class IndexError extends Error {
  /**
   * @param {string} index - The missing index name
   * @param {string} objectStore - The object store name
   */
  constructor(index, objectStore) {
    super();
    /** @type {string} The missing index name */
    this.index = index;
    /** @type {string} The object store name */
    this.objectStore = objectStore;
    Object.setPrototypeOf(this, IndexError.prototype);
  }
}

/**
 * Error thrown during fetch operations (e.g., JSON parsing failures).
 * [was: g.A1]
 *
 * @extends PlayerError
 */
export class FetchError extends PlayerError {
  /**
   * @param {string} message - Error message
   * @param {...*} args - Additional error arguments
   */
  constructor(message, ...args) {
    super(message, args);
    /** @type {number} Error type identifier (always 1 for fetch errors) */
    this.errorType = 1;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Player error message string map. [was: g.Tw]
 */
export const ERROR_MESSAGES = {
  // ~30 error code to message string mappings
};

/**
 * Alias for PlayerError, used by some call sites as `g.DetailedError`.
 * [was: g.H8 / g.DetailedError]
 */
export const DetailedError = PlayerError; // [was: g.H8 / g.DetailedError]
