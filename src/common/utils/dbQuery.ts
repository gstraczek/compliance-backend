export const clientDealsQuery = `
SELECT "pieceSize" AS deal_value, 'f0' || "clientId" AS client_id, "termStart" AS deal_timestamp
FROM dc_allocation_claim 
WHERE 'f0' || "clientId" = ANY($1::text[]) AND "termStart" > 0 AND removed = false
ORDER BY "clientId", "termStart";
`;

export const providerDistributionQuery = `
  WITH miner_pieces AS (
      SELECT 'f0' || "providerId" AS provider,
            "pieceCid",
            SUM("pieceSize") AS total_deal_size,
            MIN("pieceSize") AS piece_size
      FROM dc_allocation_claim
      WHERE 'f0' || "clientId" = ANY ($1)
        AND removed = false
        AND ("termStart" > 0 AND "termStart" < $2)
      GROUP BY provider, "pieceCid"
  ),
  miners AS (
      SELECT provider,
            SUM(total_deal_size) AS total_deal_size,
            SUM(piece_size)      AS unique_data_size
      FROM miner_pieces
      GROUP BY provider
  )
  SELECT miners.provider,
        total_deal_size,
        unique_data_size,
        (total_deal_size::FLOAT - unique_data_size) / total_deal_size::FLOAT AS duplication_percentage
  FROM miners
  ORDER BY total_deal_size DESC;`;

export const generatedReportQuery = `SELECT * FROM generated_reports WHERE client_address_id = $1 ORDER BY created_at DESC LIMIT 1`;
