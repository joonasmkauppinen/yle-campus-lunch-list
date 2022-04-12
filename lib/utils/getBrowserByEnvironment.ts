export const getBrowserByEnvironment = async () => {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined) {
    const chromium = (await import('chrome-aws-lambda')).default;
    const playwright = await import('playwright-core');

    return playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
  } else {
    return (await import('@playwright/test')).chromium.launch();
  }
};
