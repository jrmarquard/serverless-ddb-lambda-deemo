export const HTTP_HEADER_USER_CMK = "user-cmk";
export const HTTP_HEADER_USER_CREDS = "user-creds";

/* Messages */
/* Important to keep the same so to not leak what is wrong (password, cmk) */
export const HTTP_403_MESSAGE = "Forbidden. Check your CMK is valid and your password correct."