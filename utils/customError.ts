// src/utils/CustomError.ts
export class CustomError extends Error {
    public statusCode: number;
  
    constructor(message: string, statusCode: number = 500) {
      super(message);
      this.statusCode = statusCode;
      Object.setPrototypeOf(this, CustomError.prototype);
    }
  }
  
  export class NotFoundError extends CustomError {
    constructor(message: string = 'Resource not found') {
      super(message, 404);
    }
  }
  
  export class BadRequestError extends CustomError {
    constructor(message: string = 'Invalid request') {
      super(message, 400);
    }
  }