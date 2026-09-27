export function withTimeout<T>(promise: Promise<T>, timeoutMs = 30000, label = "operação"): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`Tempo limite excedido em ${label}. Verifique sua conexão e tente novamente.`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}
