// src/services/auth/ChangePasswordAPI.js
import { post } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

/**
 * POST /auth/change-password
 * Body:
 * {
 *   oldPassword: string,
 *   newPassword: string,
 *   confirmPassword: string
 * }
 */
export const changePassword = async (
  { oldPassword, newPassword, confirmPassword } = {},
  { signal } = {}
) => {
  if (!oldPassword) throw new Error("oldPassword is required");
  if (!newPassword) throw new Error("newPassword is required");
  if (!confirmPassword) throw new Error("confirmPassword is required");

  return await post({
    url: CLIENT_API_PATHS.AUTH.changePassword, // "/auth/change-password"
    data: { oldPassword, newPassword, confirmPassword },
    config: signal ? { signal } : undefined,
  });
};
