import { Request, Response } from "express";
import { createSession, findSessions, updateSessions } from "../service/session.service";
import { validatePassword } from "../service/user.service";
import { signJwt } from "../utils/jwt.utils";
import { getEnvVariable } from "../utils/helper";

export const createUserSessionHandler = async (req: Request, res: Response) => {
  // Validate the user's password
  const user = await validatePassword(req.body);

  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  // create a session
  const session = await createSession(user._id, req.get("user-agent") || "");

  // Sign Access and Refresh tokens
  const accessToken = signJwt({ ...user, session: session._id }, "ACCESS_TOKEN_PRIVATE_KEY", {
    expiresIn: `${getEnvVariable("ACCESS_TOKEN_EXPIRES_IN")}`,
  }); // 15 minutes

  const refreshToken = signJwt({ ...user, session: session._id }, "REFRESH_TOKEN_PRIVATE_KEY", {
    expiresIn: `${getEnvVariable("REFRESH_TOKEN_EXPIRES_IN")}`,
  }); // 60 minutes

  // return access & refresh tokens
  return res.send({ accessToken, refreshToken });
};

export const getUserSessionHandler = async (req: Request, res: Response) => {
  const userId = res.locals.user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.send(sessions);
};

export const deleteSessionHandler = async (req: Request, res: Response) => {
  const sessionId = res.locals.user.session;

  await updateSessions({ _id: sessionId }, { valid: false });

  return res.send({
    accessToken: null,
    refreshToken: null,
  });
};
