use pyo3::prelude::*;

/*
fn best_score_old(up: f64, total: f64) -> PyResult<f64> {
    if total == 0.0 {
        return Ok(0.0);
    }

    let z = 1.96;
    let phat = up / total;

    let a = phat + z * z / (2.0 * total);
    let s = (phat * (1.0 - phat) + z * z / (4.0 * total)) / total;
    let b = z * s.sqrt();
    let c = 1.0 + z * z / total;

    let result = (a - b) / c;
    Ok(result)
}
*/

/// workaround for lack of nth place rounding function
fn round(num: f64, place: i32) -> f64 {
    let rounder = 10.0_f64.powi(place);
    (num * rounder).trunc() / rounder
}

/// Calculates a post's best score using a Wilson Score function.
#[pyfunction]
#[pyo3(text_signature = "(up, total, /)")]
fn best_score(up: f64, total: f64) -> PyResult<f64> {
    if total == 0.0 {
        return Ok(0.0);
    }

    let z = 1.281551565545; // 80% confidence
    let p = up / total;

    let left = p + 1.0 / (2.0 * total) * z * z;
    let right = z * (p * (1.0 - p) / total + z * z / (4.0 * total * total)).sqrt();
    let under = 1.0 + 1.0 / total * z * z;

    Ok((left - right) / under)
}

/// Calculates a post's hot score. `created_timestamp` is a unix timestamp.
#[pyfunction]
#[pyo3(text_signature = "(up, total, created_timestamp, /)")]
fn hot_score(ups: f64, total: f64, created_timestamp: f64) -> PyResult<f64> {
    let score: f64 = total - (total - ups);
    let sign = if score > 0.0 {
        1.0 
    } else if score < 0.0 { 
        -1.0
    } else {
        0.0 
    };

    let order = 1.0_f64.max(score.abs()).log10();
    let seconds = created_timestamp - 1134028003.0;
    let result = sign * order + seconds / 45000.0;

    Ok(round(result, 7))
}

/// A Python module implemented in Rust.
#[pymodule]
fn libreddit_sort(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(hot_score, m)?)?;
    m.add_function(wrap_pyfunction!(best_score, m)?)?;

    Ok(())
}
