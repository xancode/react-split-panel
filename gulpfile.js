var gulp = require("gulp")
  , babel = require("gulp-babel")
  , less = require("gulp-less");

gulp.task("default", function() {
  gulp.src("./src/SplitPanel.jsx")
    .pipe(babel())
    .pipe(gulp.dest("./dist/"));

  gulp.src("./src/splitPanel.less")
    .pipe(gulp.dest("./dist/"))
    .pipe(less())
    .pipe(gulp.dest("./dist/"));
});

gulp.task("watch", ["default"], function() {
  gulp.watch("./src/**/*", ["default"]);
});
