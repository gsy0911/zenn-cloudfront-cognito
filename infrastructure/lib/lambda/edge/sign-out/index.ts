// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { stringify as stringifyQueryString } from "querystring";
import { CloudFrontRequestHandler } from "aws-lambda";
import {
  getCompleteConfig,
  extractAndParseCookies,
  generateCookieHeaders,
  createErrorHtml,
  GenerateCookieHeadersParam,
  splitDomainName
} from "../shared/shared";

let CONFIG: ReturnType<typeof getCompleteConfig>;

export const handler: CloudFrontRequestHandler = async (event) => {
  if (!CONFIG) {
    CONFIG = getCompleteConfig();
    CONFIG.logger.debug("Configuration loaded:", CONFIG);
  }
  CONFIG.logger.debug("Event:", event);
  const request = event.Records[0].cf.request;
  const domainName = request.headers["host"][0].value;
  const { idToken, accessToken, refreshToken } = extractAndParseCookies(
    request.headers,
    CONFIG.clientId,
    CONFIG.cookieCompatibility
  );
  console.info(`idToken: ${idToken},`)

  if (!idToken) {
    const response = {
      body: createErrorHtml({
        title: "Signed out",
        message: "You are already signed out",
        linkUri: `https://${domainName}${CONFIG.redirectPathSignOut}`,
        linkText: "Proceed",
      }),
      status: "200",
      headers: {
        ...CONFIG.cloudFrontHeaders,
        "content-type": [
          {
            key: "Content-Type",
            value: "text/html; charset=UTF-8",
          },
        ],
      },
    };
    CONFIG.logger.debug("Returning response:\n", response);
    return response;
  }

  const qs = {
    logout_uri: `https://${domainName}${CONFIG.redirectPathSignOut}`,
    client_id: CONFIG.clientId,
    // !! Added !!
    redirect_uri: `https://${domainName}${CONFIG.redirectPathSignOut}`,
    response_type: "token"
  };

  const generateCookieHeadersParam: GenerateCookieHeadersParam = {
    tokens: {
      id: idToken,
    },
    ...CONFIG,
  }
  const setCookies = generateCookieHeaders.signOut(generateCookieHeadersParam)
    .map((v) => ({ key: v.key, value: `${v.value}; Domain=${splitDomainName(domainName)};` }))

  const response = {
    status: "307",
    statusDescription: "Temporary Redirect",
    headers: {
      location: [
        {
          key: "location",
          value: `https://${CONFIG.cognitoAuthDomain}/logout?${stringifyQueryString(qs)}`,
        },
      ],
      "set-cookie": setCookies,
      ...CONFIG.cloudFrontHeaders,
    },
  };
  CONFIG.logger.debug("Returning response:\n", response);
  return response;
};
