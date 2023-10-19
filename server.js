import express from "express";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", async (req, res) => {
    const query = req.query.query;
    if (query == null || query == "") {
        res.render("index");
    } else {
        console.log("query: ", query);

        const queryResponse = await runQuery(query);
        console.log("queryResponse", queryResponse);

        res.render("index", {
            query: query,
            results: queryResponse,
        });
    }
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

function runQuery(queryString) {
    const body = {
        query: {
            query_string: {
                query: queryString,
            },
        },
    };
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
