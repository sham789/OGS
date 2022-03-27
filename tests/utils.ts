export const prettyPrint = <T extends any>(
  values: { [s: string]: T },
  cbfn: (val: T) => string
): { [x: string]: string } => {
  return Object.keys(values).reduce((acc, k, i) => {
    const v = values[k];

    acc[k] = cbfn(v);

    return acc;
  }, {} as { [x: string]: string });
};

export const prettyPrintContractDeployment = <
  T extends { address: string }
>(values: {
  [s: string]: T;
}) => {
  return prettyPrint(values, (x) => x.address);
};
