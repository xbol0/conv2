import { serve } from "https://deno.land/std@0.159.0/http/server.ts";
import {
  parse as YamlParse,
  stringify as YamlStringify,
} from "https://deno.land/std@0.159.0/encoding/yaml.ts";

type Context = {
  from: string;
  to: string;
  input: string;
};

const ConvertRouter = new Map<string, (i: string) => string>([
  ["yaml:json", yaml__json],
  ["json:yaml", json__yaml],
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

function showHelp(ctx: Context, req: Request) {
  const host = new URL(req.url).origin;
  return new Response(
    `Usage: POST/PUT ${host}/${ctx.from || ":from"}/${ctx.to || ":to"}
    
  Example: curl -d '{"name": "tom"}' ${host}/json/yaml`,
    { headers: { "content-type": "text/plain" } },
  );
}

function start() {
  serve(handleRequest);
}

start();
