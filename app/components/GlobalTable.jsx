import { IndexTable, Text } from "@shopify/polaris";

export default function GlobalTable({ headers, rows }) {
  return (
    <IndexTable
      resourceName={{ singular: "item", plural: "items" }}
      itemCount={rows.length}
      selectable={false}
      headings={headers.map((h) => ({ title: h }))}
    >
      {rows.map((row, index) => (
        <IndexTable.Row id={String(index)} key={index} position={index}>
          {row.map((cell, i) => (
            <IndexTable.Cell key={i}>
              {typeof cell === "string" ? <Text>{cell}</Text> : cell}
            </IndexTable.Cell>
          ))}
        </IndexTable.Row>
      ))}
    </IndexTable>
  );
}
