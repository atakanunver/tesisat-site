module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });
  return {
    dir: {
      input: "site",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
