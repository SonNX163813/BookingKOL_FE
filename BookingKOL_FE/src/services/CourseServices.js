import { get, post } from "../config/axios-config";
import { API_PATHS } from "../constants/apiPath";

export const getAllCourse = async (
  page,
  size,
  minPrice,
  maxPrice,
  minDiscount,
  maxDiscount,
  sortBy,
  sortDir
) => {
  return await get({
    url: API_PATHS.COURSE.getAllCourse,
    params: {
      page: page,
      size: size,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      minDiscount: minDiscount ?? null,
      maxDiscount: maxDiscount ?? null,
      sortBy: sortBy ?? "price",
      sortDir: sortDir ?? "asc",
    },
  });
};

export const getDetailCourse = async (id) => {
  return await get({
    url: `${API_PATHS.COURSE.adminViewDetailCourse}/${id}`,
  });
};

export const createCourse = async (value) => {
  const formData = new FormData();
  const requestPayload = {
    name: value.name,
    price: value.price,
    discount: value.discount,
    description: value.description,
  };

  const blob = new Blob([JSON.stringify(requestPayload)], {
    type: "application/json",
  });

  formData.append("coursePackageDTO", blob);
  formData.append("courseMedias", value.courseMedias);

  return await post({
    url: API_PATHS.COURSE.createCourse,
    data: formData,
  });
};
