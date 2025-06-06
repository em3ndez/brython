Execution options
-----------------

A number of options are available to customize script execution. They can be
defined at the HTML page level, or by script.

Defining options
----------------

Declaring options for the whole page is done through the attributes of a
specific HTML tag `<brython-options>`. This tag should be placed preferably in
section `<body>` of the document, not in `<head>`.

For instance, to define the options `debug` and `cache`:

```xml
<brython-options debug="1" cache="true">
</brython-options>
```

To define an option for a specific script, use the attribute of the `<script>`
tag:

```xml
<script type="text/python" debug="2">
```

Options only available at page level
------------------------------------

*ids*

> by default, all the scripts in the page are executed. This options specifies
> a list of scripts to execute, as a space-separated list of identifiers
> (attribute `id` of the `<script>` tag)
>
> If the string is empty, no script is executed.

<blockquote>
```xml
<brython-options ids="scriptA scriptB"></brython-options>
```
</blockquote>

*indexedDB*

> specifies if the program can use the indexedDB database to
> store a compiled version of the modules located in __brython_stdlib.js__
> or __brython_modules.js__. Defaults to `true`.

Options available at page or script level
-----------------------------------------

An option defined at script level (attribute of `<script>`) has precedence
over the same option defined at page level (attribute of `<brython-options>`).

*args*

> equivalent to command-line arguments, available in programs by `sys.argv`.
> Values are strings.

*cache*

> if set to `true`, the Ajax calls to import modules, load external
> scripts by `<script src="foo.py">` or read files with `open()` use the
> browser cache. Defaults to `false`.

*debug* : the debug mode

- 1 (default): error messages are printed in the browser console (or to the
  output stream specified by `sys.stderr`). Use this when the application is 
  stable
- 2: the translation of Python code into Javascript code is printed in the
  console
- 10: the translation of Python code and of the imported modules is printed
  in the console

*js_tab* : Javascript code indentation

> an integer between 1 and 4 to specify the number of whitespaces used for
> indenting the Javascript code generated by Brython. Defaults to 2.

*pythonpath*

> a space-separated list of paths where imported modules should be searched

*static\_stdlib\_import*

> boolean, indicates if, in order to import modules or packages from the
> standard library, the static mapping table in the script
> __stdlib\_paths.js__ should be used. Defaults to `true`

The function <i>brython(options)</i>
-----------------------------------

In Brython versions prior to 3.12, options could only be defined for all the
scripts in the page as an argument to the function `brython()`, explicitely
called on page load by the syntax

```xml
<body onload="brython({debug: 2})">
```

For backwards compatibility, this syntaxe remains usable in version 3.12.

If a page defined a tag `<brython-options>`, the values passed to function
`brython()` replace those of the tag.
