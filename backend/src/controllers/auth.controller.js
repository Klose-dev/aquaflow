import asyncHandler from "../middleware/asyncHandler.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await authService.register({ name, email, password });

  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token: user.token,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await authService.login({ email, password });

  res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token: user.token,
  });
});
