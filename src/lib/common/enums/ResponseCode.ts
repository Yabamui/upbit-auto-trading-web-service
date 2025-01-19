export interface ResponseCodeData {
  code: string;
  title: string;
  message: string;
  status: number;
}

export const ResponseCode = {
  success: {
    code: "0",
    title: "Success",
    message: "Success",
    status: 200
  },
  notFound: {
    code: "4",
    title: "Not Found",
    message: 'Oh, I can\'t find it!',
    status: 404
  },
  alreadyExists: {
    code: "4_A_E",
    title: "Bad Request",
    message: "Hey, it already exists!",
    status: 404
  },
  wrongParameter: {
    code: "4_W_P",
    title: "Bad Request",
    message: "Hey, you have wrong parameter!",
    status: 404
  },
  unauthorized: {
    code: "4-U",
    title: "Unauthorized",
    message: "You are not authorized to access this resource",
    status: 401
  },
  internalServerError: {
    code: "5",
    title: "Internal Server Error",
    message: "Sorry, something went wrong!",
    status: 500
  },
  unknownError: {
    code: "5-1",
    title: "Unknown Error",
    message: "Sorry, something went wrong?!",
    status: 500
  },
  notImplemented: {
    code: "5-2",
    title: "Not Implemented",
    message: "Sorry, this feature is not implemented yet!",
    status: 501
  }
} as const;

export type ResponseCode = typeof ResponseCode[keyof typeof ResponseCode];