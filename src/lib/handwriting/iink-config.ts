export interface IinkConfig {
  configuration: {
    server: {
      applicationKey: string;
      hmacKey: string;
      scheme: string;
      host: string;
    };
    recognition: {
      type: string;
      text: {
        mimeTypes: string[];
        guides?: { enable: boolean };
      };
      lang: string;
      export: {
        jiix: {
          "bounding-box": boolean;
        };
      };
    };
  };
}

// lexicon parameter reserved for future MyScript custom lexicon support
export function getIinkConfig(): IinkConfig {
  const appKey = process.env.NEXT_PUBLIC_MYSCRIPT_APPLICATION_KEY ?? "";
  const hmacKey = process.env.NEXT_PUBLIC_MYSCRIPT_HMAC_KEY ?? "";
  const serverUrl = process.env.NEXT_PUBLIC_MYSCRIPT_SERVER_URL ?? "https://cloud.myscript.com";

  const url = new URL(serverUrl);

  const config: IinkConfig = {
    configuration: {
      server: {
        applicationKey: appKey,
        hmacKey: hmacKey,
        scheme: url.protocol.replace(":", ""),
        host: url.host,
      },
      recognition: {
        type: "TEXT",
        text: {
          mimeTypes: ["application/vnd.myscript.jiix"],
          guides: { enable: true },
        },
        lang: "en_GB",
        export: {
          jiix: {
            "bounding-box": false,
          },
        },
      },
    },
  };

  return config;
}
