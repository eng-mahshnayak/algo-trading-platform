import axios from "axios";


import InstrumentModel from "../models/instrumentPostgreModel.js";

import sequelize from "../config/db.js";



function computeSy(inst) {
  const symbol = String(inst.symbol ?? "");
  const name   = String(inst.name ?? "");
  const expiry = String(inst.expiry ?? "");

  let value = symbol.replace(name, "");
  if (!value) return { SyNum: null, syType: null };

  const m = expiry.match(/^(\d+[A-Z]{3})/);
  let result = value;
  if (m && m[1]) {
    const temp = value.replace(m[1], "");
    result = temp.slice(2);
  }
  const numMatch  = result.match(/\d+/);
  const typeMatch = result.match(/[A-Z]+/);

  const SyNum  = numMatch ? String(parseInt(numMatch[0], 10)) : null; // keep as string
  const syType = typeMatch ? typeMatch[0] : null;

  return { SyNum, syType,name };
}

export async function bulkUpdateSyFieldsJS(batchSize = 5000) {
  let offset = 0;
  let totalUpdated = 0;

  for (;;) {
    const rows = await InstrumentModel.findAll({
      attributes: ["id", "symbol", "name", "expiry"],
      offset,
      limit: batchSize,
      raw: true,
    });
    if (rows.length === 0) break;

    const updates = rows.map(r => {
      const { SyNum, syType,name } = computeSy(r);
      return {
        id: r.id,
        name,
        SyNum,
        syType,
      };
    });

    // Use bulk upsert-style update via temp table or loop:
    // simplest (but N queries):
    await sequelize.transaction(async (tx) => {
      for (const u of updates) {

        console.log(u,'hhy');
        

        let concate =  u.name+u.SyNum+u.syType
        await InstrumentModel.update(
          // { SyNum: u.SyNum, syType: u.syType },
           { SyNum:  u.SyNum, syType: u.syType,nameStrickType:concate },
          { where: { id: u.id }, transaction: tx }
        );
        totalUpdated++;
      }
    });

    offset += rows.length;
    console.log(`✅ processed ${offset}, updated so far ${totalUpdated}`);
  }

  console.log(`🎉 Done. Updated ${totalUpdated} rows`);
}


/**
 * Bulk insert or update Angel One instruments into PostgreSQL
 */
export const bulkInsertPostgre = async () => {
  try {

      await InstrumentModel.destroy({
        where: {},       // empty condition = all rows
        truncate: true,  // faster than deleting one-by-one
        restartIdentity: true // optional: resets auto-increment IDs
      });

      console.log("✅ All Instruments deleted successfully!");

    console.log("⬇️ Fetching instruments...");

    const { data } = await axios.get(
      "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
      { timeout: 120000 }
    );

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response: not an array");
    }

    console.log(`📦 Received ${data.length} instruments`);

    // 🔹 Prepare mapped rows for insertion
    const rows = data.map((it) => ({
      token:    String(it.token ?? it.Token ?? ""),
      symbol:   String(it.symbol ?? it.Symbol ?? ""),
      name:     String(it.name ?? it.Name ?? ""),
      instrumenttype: String(it.instrumenttype ?? it.InstrumentType ?? ""),
      expiry:   String(it.expiry ?? it.Expiry ?? ""),
      lotsize:  String(it.lotsize ?? it.LotSize ?? "1"),
      exch_seg: String(it.exch_seg ?? it.Exchange ?? ""),
      SyNum:    String(it.SyNum ?? ""),
      syType:   String(it.syType ?? ""),
      raw:      it, // store entire original JSON object
    }));

    // 🔹 Chunk insert (to prevent memory overload)
    const CHUNK = 5000;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);

      await InstrumentModel.bulkCreate(chunk, {
        updateOnDuplicate: [
          "symbol", "name","instrumenttype", "expiry", "lotsize", "exch_seg",
          "SyNum", "syType", "raw", "updatedAt",
        ],
      });

      inserted += chunk.length;

      console.log(`✅ Inserted/Updated ${inserted}/${rows.length}`);
    }

    console.log(`🎉 Done. Successfully upserted ${inserted} records.`);

    bulkUpdateSyFieldsJS()

  } catch (error) {

    console.error("❌ Error during bulk insert:", error.message || error);

  }
};







