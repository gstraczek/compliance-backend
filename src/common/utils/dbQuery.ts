export const clientDealsQuery = `
SELECT piece_size AS deal_value, client AS client_id, start_epoch AS deal_timestamp
FROM current_state 
WHERE client = ANY($1::text[]) AND start_epoch != -1 AND verified_deal = true
ORDER BY client, start_epoch
`;

export const providerDistributionQuery = `
  WITH miner_pieces AS (SELECT provider,
                               SUM(piece_size) AS total_deal_size
                        FROM current_state
                        WHERE current_state.client = ANY ($1)
                          AND verified_deal = true
                          AND slash_epoch < 0
                          AND end_epoch > $2
                          AND (sector_start_epoch > 0 AND sector_start_epoch < $2)
                        GROUP BY provider),
       miners AS (SELECT provider,
                         SUM(total_deal_size) AS total_deal_size
                  FROM miner_pieces
                  GROUP BY provider)
  SELECT miners.provider,
         total_deal_size
  FROM miners
  `;

export const generatedReportQuery = `SELECT * FROM generated_reports WHERE client_address_id = $1 ORDER BY created_at DESC LIMIT 1`;
