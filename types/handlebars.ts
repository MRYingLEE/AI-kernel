// https://github.com/handlebars-lang/handlebars.js/pull/1862
declare module 'handlebars/lib/handlebars' {
    // Re-export the types from the existing handlebars module
    import Handlebars = require('handlebars');
    export default Handlebars;
  }