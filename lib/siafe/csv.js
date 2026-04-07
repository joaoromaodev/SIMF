function finalizeCell(cell) {
  if (cell.startsWith("\ufeff")) {
    return cell.slice(1);
  }

  return cell;
}

function countDelimiterInFirstRecord(text, delimiter) {
  let inQuotes = false;
  let count = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      break;
    }

    if (character === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
}

export function detectCsvDelimiter(text) {
  const commaCount = countDelimiterInFirstRecord(text, ",");
  const semicolonCount = countDelimiterInFirstRecord(text, ";");

  return semicolonCount > commaCount ? ";" : ",";
}

export function parseCsv(text, delimiter = detectCsvDelimiter(text)) {
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

    if (character === delimiter && !inQuotes) {
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
