import express from "express";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", async (req, res) => {
    // console.log(req.query);
    const query = req.query.query;
    const useSynonymFilter = req.query.useSynonymFilter;
    if (query == null || query == "") {
        res.render("index", { form: {}, results: []});
    } else {
        console.log("query: ", query);

        const queryResponse = await runQuery(query, useSynonymFilter == "yes");
        console.log("queryResponse", queryResponse);

        res.render("index", {
            form: {
                query: query,
                useSynonymFilter: useSynonymFilter,
            },
            results: queryResponse,
        });
    }
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

function runQuery(queryString, useSynonymFilter) {
    const body = {
        query: {
            query_string: {
                query: queryString,
            },
        },
    };

    if (useSynonymFilter) {
        body.query.query_string.analyzer = "syn_analyzer";
    }

    return fetch("http://localhost:9200/sinhala-poem-metaphors/_search", {
        method: "post",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => res.json())
        .then((json) => {
            console.log("elastic search response: ", json);

            if (json.hits.total.value > 0) {
                return json.hits.hits.map((hit) => {
                    return {
                        poem_name: hit._source.poem_name,
                        poet: hit._source.poet,
                        line: hit._source.line,
                        metaphor_present: hit._source.metaphor_present,
                        metaphorical_terms: hit._source.metaphorical_terms,
                        source_domain: hit._source.source_domain,
                        target_domain: hit._source.target_domain,
                        interpretation: hit._source.interpretation,
                    };
                });
            } else {
                return [];
            }
        })
        .catch((err) => console.log(err));
}
