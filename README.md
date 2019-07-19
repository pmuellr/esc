command-line utility to invoke elasticsearch requests
================================================================================

usage
--------------------------------------------------------------------------------

command-line utility to invoke elasticsearch requests

usage:

    esc [api] [esParams] [esOptions]
        make an http request with the specified API, params and options
    esc [api] help
        get help on an api
    esc apis
        list the apis

`[api]` is an elasticsearch api like "index" and "indices.analyze".

`[esParams]` and `[esOptions]` are sloppy JSON strings (presumable enclosed in
single quotes), as described in https://github.com/pmuellr/sloppy-json

The following options can also be used

    -h --help             print this help
    -v --version          print the version of the program
    -u --urlBase [url]    elasticsearch base URL; default: http://elastic:changeme@localhost:9220

You can also set the env var ES_URLBASE as the elasticsearch base URL.

Set the DEBUG environment variable to any string for additional diagnostics.

For authenticated elasticsearch access, the url should include the
userid/password, for example "http://elastic:changeme@localhost:9220"

install
--------------------------------------------------------------------------------

    npm install -g pmuellr/esc

examples
--------------------------------------------------------------------------------

```console
$ esc index '{index: foo body: {foo: 1}}'
{
    "body": {
        "_index": "foo",
        "_type": "_doc",
        "_id": "thtOCGwBjWnYRDyrYWYD",
        ...
    },
    "statusCode": 201,
    "headers": {
        "location": "/foo/_doc/thtOCGwBjWnYRDyrYWYD",
        "content-type": "application/json; charset=UTF-8",
        "content-length": "170"
    },
    "warnings": null,
    "meta": {
        ...
    }
}

$ esc search '{index: foo}'
{
    "body": {
        ...
        "hits": {
            "total": {
                "value": 1,
                "relation": "eq"
            },
            "max_score": 1,
            "hits": [
                {
                    "_index": "foo",
                    "_type": "_doc",
                    "_id": "thtOCGwBjWnYRDyrYWYD",
                    "_score": 1,
                    "_source": {
                        "foo": 1
                    }
                }
            ]
        }
    },
    ...
}
```