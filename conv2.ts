import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  parse as YamlParse,
  stringify as YamlStringify,
} from "https://deno.land/std@0.177.0/encoding/yaml.ts";
import {
  parse as TomlParse,
  stringify as TomlStringify,
} from "https://deno.land/std@0.177.0/encoding/toml.ts";
import * as hex from "https://deno.land/std@0.177.0/encoding/hex.ts";
import { bech32 } from "https://esm.sh/bech32@2.0.0";

type Context = {
  from: string;
  to: string;
  input: string;
};

const ConvertRouter = new Map<string, (i: string) => string>([
  ["yaml:json", yaml__json],
  ["json:yaml", json__yaml],
  ["toml:json", toml__json],
  ["json:toml", json__toml],
  ["toml:yaml", toml__yaml],
  ["yaml:toml", yaml__toml],
  ["hex:bech32", hex__bech32],
  ["bech32:hex", bech32__hex],
]);

async function handleRequest(req: Request) {
  const params = new URL(req.url).pathname.slice(1).split("/");
  if (req.method == "GET") {
    return showHelp({
      from: params[0] || "",
      to: params[1] || "",
      input: "",
    }, req);
  }

  if (req.method == "POST" || req.method == "PUT") {
    if (params.length != 2) {
      return showHelp({
        from: params[0] || "",
        to: params[1] || "",
        input: "",
      }, req);
    } else {
      const input = await req.text();
      return convertRoute({ from: params[0], to: params[1], input });
    }
  }

  return new Response(null, { status: 404 });
}

function convertRoute(ctx: Context) {
  const fn = ConvertRouter.get(`${ctx.from}:${ctx.to}`);
  if (!fn) {
    return new Response(
      `Convert "${ctx.from}" to "${ctx.to}" current does not support.`,
      {
        status: 400,
      },
    );
  }

  try {
    return new Response(fn(ctx.input), {
      headers: { "content-type": "text/plain" },
    });
  } catch (err) {
    return new Response(`ERROR: ${err.message}`, { status: 400 });
  }
}

// yaml2json
function yaml__json(input: string) {
  return JSON.stringify(YamlParse(input));
}

// json2yaml
function json__yaml(input: string) {
  return YamlStringify(JSON.parse(input));
}

// json2toml
function json__toml(input: string) {
  return TomlStringify(JSON.parse(input));
}

// toml2json
function toml__json(input: string) {
  return JSON.stringify(TomlParse(input));
}

// yaml2toml
function yaml__toml(input: string) {
  return TomlStringify(YamlParse(input) as Record<string, unknown>);
}

// toml2yaml
function toml__yaml(input: string) {
  return YamlStringify(TomlParse(input));
}

// hex2bech32
function hex__bech32(input: string) {
  const words = bech32.toWords(
    hex.decode(new TextEncoder().encode(input)),
  );
  return bech32.encode("bc", words);
}

// bech322hex
function bech32__hex(input: string) {
  const res = bech32.decode(input);
  return new TextDecoder().decode(hex.encode(
    new Uint8Array(bech32.fromWords(res.words)),
  ));
}

function showHelp(ctx: Context, req: Request) {
  const host = new URL(req.url).origin;
  return new Response(
    `Usage: POST/PUT ${host}/${ctx.from || ":from"}/${ctx.to || ":to"}
    
  Example: curl -d '{"name": "tom"}' ${host}/json/yaml`,
    { headers: { "content-type": "text/plain" } },
  );
}

serve(handleRequest);
