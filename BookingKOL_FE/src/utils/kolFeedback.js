const STAR_LEVELS = [5, 4, 3, 2, 1];
const FALLBACK_COMMENT = "Khách hàng chưa để lại nhận xét.";
const FALLBACK_DATE = "Đang cập nhật";

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const roundToOneDecimal = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 10) / 10;
};

const createEmptyDistribution = () =>
  STAR_LEVELS.map((stars) => ({
    stars,
    count: 0,
    percentage: 0,
  }));

const clampStar = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }
  if (value <= 0) {
    return null;
  }
  return Math.max(1, Math.min(5, Math.round(value)));
};

const formatDateLabel = (value) => {
  if (!value) {
    return FALLBACK_DATE;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return FALLBACK_DATE;
  }
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch (error) {
    console.warn("Failed to format review date", error);
    return FALLBACK_DATE;
  }
};

const normalizeRating = (feedback) => {
  const ratingSources = [
    feedback?.overallRating,
    feedback?.professionalismRating,
    feedback?.communicationRating,
    feedback?.timelineRating,
    feedback?.contentQualityRating,
  ]
    .map((value) => toNumberOrNull(value))
    .filter((value) => value != null);

  if (ratingSources.length === 0) {
    return 0;
  }

  const total = ratingSources.reduce((sum, value) => sum + value, 0);
  return total / ratingSources.length;
};

export const buildKolReviewsData = (kol) => {
  const baseResponse = {
    reviews: [],
    overallRating: 0,
    ratingDistribution: createEmptyDistribution(),
    reviewCount: 0,
  };

  if (!kol) {
    return baseResponse;
  }

  const rawFeedbacks = Array.isArray(kol.feedbacks)
    ? kol.feedbacks.filter(Boolean)
    : [];

  if (rawFeedbacks.length === 0) {
    const fallbackCount = toNumberOrNull(kol?.feedbackCount) ?? 0;
    return {
      ...baseResponse,
      overallRating: roundToOneDecimal(toNumberOrNull(kol?.overallRating) ?? 0),
      reviewCount: fallbackCount,
    };
  }

  const sortedFeedbacks = [...rawFeedbacks].sort((a, b) => {
    const aTime = new Date(a?.createdAt ?? 0).getTime();
    const bTime = new Date(b?.createdAt ?? 0).getTime();
    return bTime - aTime;
  });

  const reviews = sortedFeedbacks.map((feedback, index) => {
    const rating = normalizeRating(feedback);
    const commentPublic =
      typeof feedback?.commentPublic === "string"
        ? feedback.commentPublic.trim()
        : "";
    const commentPrivate =
      typeof feedback?.comment === "string" ? feedback.comment.trim() : "";

    return {
      id: feedback?.id ?? `feedback-${index}`,
      name: feedback?.reviewerUserName?.trim() || "Khách hàng",
      avatarUrl: feedback?.reviewerUserAvatarUrl || null,
      rating,
      content: commentPublic || commentPrivate || FALLBACK_COMMENT,
      time: formatDateLabel(feedback?.createdAt),
      createdAt: feedback?.createdAt ?? null,
    };
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
        reviews.length
      : 0;

  const providedOverall = toNumberOrNull(kol?.overallRating);
  const overallRating = roundToOneDecimal(
    providedOverall && providedOverall > 0 ? providedOverall : averageRating
  );

  const providedCount = toNumberOrNull(kol?.feedbackCount);
  const reviewCount =
    providedCount && providedCount > 0 ? providedCount : reviews.length;

  const ratingDistribution = createEmptyDistribution().map((entry) => ({
    ...entry,
  }));

  const denominator = reviews.length || reviewCount || 0;

  reviews.forEach((review) => {
    const star = clampStar(review.rating);
    if (!star) return;
    const target = ratingDistribution.find((entry) => entry.stars === star);
    if (target) {
      target.count += 1;
    }
  });

  ratingDistribution.forEach((entry) => {
    entry.percentage =
      denominator > 0 ? Math.round((entry.count / denominator) * 100) : 0;
  });

  return {
    reviews,
    overallRating,
    ratingDistribution,
    reviewCount,
  };
};

export default buildKolReviewsData;
