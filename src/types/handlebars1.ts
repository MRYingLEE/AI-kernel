// https://github.com/handlebars-lang/handlebars.js/pull/1862
// The solution was suggested by khoait
declare module 'handlebars/lib/handlebars' {
  // Re-export the types from the existing handlebars module
  import Handlebars = require('handlebars');
  export default Handlebars;
}
