UPDATE processos SET nup = ''00000.0.'' || SUBSTRING(nup FROM 10 FOR 6) || ''/'' || SUBSTRING(nup FROM 17 FOR 4)
WHERE nup ~ ''^00001\.0\.[0-9]{6}/[0-9]{4}$'';
