import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Stack,
  Alert,
  Snackbar,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useParams } from "react-router-dom";
import ProfileHeader from "../../../components/home/kol-detail/ProfileHeader";
import Introduction from "../../../components/home/kol-detail/Introduction";
import ReviewsSection from "../../../components/home/kol-detail/ReviewsSection";
import { getKolProfileById } from "../../../services/kol/KolAPI";
import hotkolimg from "../../../assets/hotkol.png";

const CourseLivesteam = () => {
  return <></>;
};

export default CourseLivesteam;
