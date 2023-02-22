# Conv2

 Online data format converter for Deno.

## Usage

It can be deploy on Deno Deploy.

```
deno run -A conv2.ts
```

## Features

Current supports these formats converting:

- YAML -> JSON
- JSON -> YAML
- YAML -> TOML
- TOML -> YAML
- JSON -> TOML
- TOML -> JSON
- bech32 -> hex
- hex -> bech32

## API

```
POST/PUT /:from/:to
```

Example:

Convert `JSON` to `YAML`:

```
curl -d '{"name":"tom"}' example.com/json/yaml
```

Or use a file:

```
curl -T file.yml example.com/yaml/json
```