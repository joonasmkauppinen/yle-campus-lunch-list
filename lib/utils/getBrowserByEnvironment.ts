import playwright from 'playwright-core';

export const getBrowserByEnvironment = async () => {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined) {
    const args = (await import('chrome-aws-lambda')).default.args;
    const executablePath = (await import('chrome-aws-lambda')).default.executablePath;
    const headless = (await import('chrome-aws-lambda')).default.headless;

    return playwright.chromium.launch({
      args: args,
      executablePath: await executablePath,
      headless: headless,
    });
  } else {
    return playwright.chromium.launch();
  }
};
