import { get, remove } from "../config/axios-config";
import { API_PATHS } from "../constants/apiPath";

export const getAllCategory = async () => {
  return await get({
    url: API_PATHS.CATEGORY.getAllCategory,
  });
};

export const getCategoryById = async (id) => {
  return await get({
    url: `${API_PATHS.CATEGORY.getCategoryById}/${id}`,
  });
};

export const deleteCategoryById = async (id) => {
  return await remove({
    url: `${API_PATHS.CATEGORY.deleteCategory}/${id}`,
  });
};
