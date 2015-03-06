var gulp = require('gulp'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    paths = require('./paths.js'),
    filter = require('gulp-filter'),
    tag_version = require('gulp-tag-version'),
	runSequence = require('run-sequence').use(gulp),
	manifest = require('gulp-manifest'),
	spawn = require('child_process').spawn;
	

var manifestFile = './server.html.manifest';

function inc(importance) {
    // get all the files to bump version in
    return gulp.src(['./package.json', './bower.json']) 
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'));
}

gulp.task('publish', function (done) {
  spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});

gulp.task('push', function (done) {
  git.push('origin', 'gh-pages', {args: " --tags"}, function (err) {
    if (err) throw err;
  });
});

gulp.task('commitDist', function() {
	  return gulp.src(['./' + paths.docDir + '/*', './' + paths.bundleDir + '/*', manifestFile])
	    .pipe(git.add({args: '-f'}))
	    .pipe(git.commit("Updated dist/docs"));
});

gulp.task('tag', function() {
	return gulp.src(['./package.json', './bower.json'])
    .pipe(git.commit('version bump'))
    // read only one file to get the version number
	.pipe(filter('package.json')) 
	.pipe(tag_version());
});
gulp.task('buildManifest', function(){
  gulp.src(['./dist/yasgui.min.css', './dist/yasgui.min.js'], {cwd: __dirname + '/../'})
    .pipe(manifest({
      hash: true,
      timestamp: false,
//      cache: ['./dist/yasgui.min.css','./dist/yasgui.min.js'],
      filename: manifestFile,
      basePath: './dist'
     }))
    .pipe(gulp.dest('./'));
});

gulp.task('bumpPatch', function() { return inc('patch'); })
gulp.task('bumpMinor', function() { return inc('minor'); })
gulp.task('bumpMajor', function() { return inc('major'); })

gulp.task('patch', function() {
	runSequence('bumpPatch', 'default', 'buildManifest', 'commitDist', 'tag', 'publish', 'push');
});
gulp.task('minor', function() {
	runSequence('bumpMinor', 'default', 'buildManifest', 'commitDist', 'tag', 'publish', 'push');
});
gulp.task('major', function() {
	runSequence('bumpMajor', 'default', 'buildManifest', 'commitDist', 'tag', 'publish', 'push');
});
