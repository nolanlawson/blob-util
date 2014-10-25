blob-util
=====

[![Build Status](https://travis-ci.org/nolanlawson/blob-util.svg)](https://travis-ci.org/nolanlawson/blob-util)

You know what's cool? [HTML5 Blobs](https://developer.mozilla.org/en-US/docs/Web/API/Blob?redirectlocale=en-US&redirectslug=DOM%2FBlob).

You know what's hard to work with? Yeah, you guessed it.

If you just want to work with binary data in the browser and not pull your hair out, then this is the library for you.

This library offers various utilities for transforming Blobs between different formats (base 64, data URL, image), and it works
cross-browser.

This library is also a good pairing with the attachment API in [PouchDB](http://pouchdb.com).

Building
----
    npm install
    npm run build

Your plugin is now located at `dist/pouchdb.mypluginname.js` and `dist/pouchdb.mypluginname.min.js` and is ready for distribution.



Testing
----


### In the browser

Run `npm run dev` and then point your favorite browser to [http://127.0.0.1:8001/test/index.html](http://127.0.0.1:8001/test/index.html).

The query param `?grep=mysearch` will search for tests matching `mysearch`.

### Automated browser tests

You can run e.g.

    CLIENT=selenium:firefox npm test
    CLIENT=selenium:phantomjs npm test

This will run the tests automatically and the process will exit with a 0 or a 1 when it's done. Firefox uses IndexedDB, and PhantomJS uses WebSQL.