import React from "react";
import { Grid } from "@mui/material";
import CourseCard from "./CourseCard";

const CoursesGrid = ({ courses, onSelectCourse }) => (
  <Grid
    container
    spacing={{ xs: 2, md: 3 }}
    columns={{ xs: 12, sm: 12, md: 24, lg: 60 }}
  >
    {courses.map((course) => (
      <Grid item xs={12} sm={6} md={8} lg={6} key={course.id ?? course.name}>
        <CourseCard course={course} onSelect={onSelectCourse} />
      </Grid>
    ))}
  </Grid>
);

export default CoursesGrid;
