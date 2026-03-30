function finalizeCell(cell) {
  if (cell.startsWith("\ufeff")) {
    return cell.slice(1);
  }

  return cell;
}

export function parseCsv(text) {
  const rows = [];
  let currentCell = "";
  let currentRow = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(finalizeCell(currentCell));
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(finalizeCell(currentCell));
      currentCell = "";

      if (currentRow.some((value) => value !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(finalizeCell(currentCell));

    if (currentRow.some((value) => value !== "")) {
      rows.push(currentRow);
    }
  }

  const [header = [], ...dataRows] = rows;

  return { header, rows: dataRows };
}

