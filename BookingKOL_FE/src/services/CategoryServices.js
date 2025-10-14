import { get, patch, post, remove } from "../config/axios-config";
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

export const createCategory = async (value) => {
  const data = {
    name: value.name,
    key: value.key,
  };
  return await post({
    url: API_PATHS.CATEGORY.createCategory,
    data: data,
  });
};

export const patchCategory = async (value) => {
  const data = {
    name: value.name,
    key: value.key,
  };
  return await patch({
    url: `${API_PATHS.CATEGORY.patchCategory}/${value.id}`,
    data: data,
  });
};
