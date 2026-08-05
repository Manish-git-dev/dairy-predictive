const csvExport = (data, columns) => {
  if (!data || !data.length) return '';
  if (!columns || !columns.length) {
    columns = Object.keys(data[0]).map(key => ({ header: key, key }));
  }

  const headerRow = columns.map(col => `"${col.header}"`).join(',');

  const dataRows = data.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (val === null || val === undefined) val = '';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

module.exports = csvExport;
