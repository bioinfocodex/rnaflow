# Contributing to RNAflow

Thank you for helping. Bug reports, questions and pull requests are all
welcome.

## Reporting a problem

Open an [issue](https://github.com/bioinfocodex/rnaflow/issues) with:

- what you were doing: the page, and your organism, read type and
  quantification route;
- what happened, including the output of the failing step (RNAflow keeps each
  job's log in `~/.rnaflow/logs`);
- your operating system and RNAflow version (Help → About).

If the problem is a wrong result rather than an error, say how you know it is
wrong, for example a published comparison or a known control gene.

## Changing the code

The app is one HTML file built from `src/`. Edit there, never in
`RNAflow_App.html`:

```bash
node tools/build.mjs                          # build RNAflow_App.html
cd tests && npm ci && npm test && cd ..       # command-generator tests
python3 -m unittest discover tests            # server tests
./sync.sh                                     # copy to files/ and website/
```

CI runs the same checks on Linux and macOS for every pull request.
`src/README.md` explains where things live.

When you fix a bug in a generated command, add a test in
`tests/app.test.mjs` that fails without your fix. When a change could alter
results, also run the end-to-end benchmark (`benchmark/README.md`; about an
hour and 3 GB) and include its table in the pull request.

Changing a pinned version in `RNAFLOW_ENV` (`src/js/03-environment.js`)
needs the whole set re-solved for osx-arm64, osx-64 and linux-64 together,
because a version that exists on one platform can be missing or conflict on
another. With the new pins in `env.yml`:

```bash
for sub in osx-arm64 osx-64 linux-64; do
  CONDA_SUBDIR=$sub CONDA_OVERRIDE_GLIBC=2.28 \
    mamba env create -n solve-test -f env.yml --dry-run > /dev/null \
    && echo "$sub ok" || echo "$sub FAILS"
done
```

## Conduct

Be kind and assume good faith. People using RNAflow are often new to the
command line; answer the question they asked, in plain words.
