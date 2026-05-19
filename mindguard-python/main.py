# main.py - MindGuard Python Processing Engine
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from config.database import db
from config.logger import get_logger
from services.baseline_calculator import BaselineCalculator
from services.risk_scorer import RiskScorer

logger = get_logger(__name__)

app = FastAPI(title="MindGuard Processing Engine", version="1.0.0")

baseline_calculator = BaselineCalculator()
risk_scorer = RiskScorer()

# ============================================
# MODELS
# ============================================

class BaselineRequest(BaseModel):
    user_id: str

class RiskRequest(BaseModel):
    user_id: str

# ============================================
# ROUTES
# ============================================

@app.get("/")
def root():
    return {"status": "MindGuard Python Engine running!", "version": "1.0.0"}

@app.get("/health")
def health():
    try:
        db.execute_query("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

@app.post("/baseline/calculate")
def calculate_baseline(req: BaselineRequest):
    try:
        result = baseline_calculator.calculate_all_baselines(req.user_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/risk/calculate")
def calculate_risk(req: RiskRequest):
    try:
        result = risk_scorer.calculate_risk(req.user_id)
        return {"success": True, "data": result}
    except Exception as e:
        import traceback
        logger.error("Risk calc error for user %s:\n%s", req.user_id, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/baseline/{user_id}")
def get_baselines(user_id: str):
    try:
        query = """
            SELECT st.name, b.baseline_value, b.rolling_7d_value, b.updated_at
            FROM baselines b
            JOIN signal_types st ON b.signal_type_id = st.id
            WHERE b.user_id = %s AND b.is_current = TRUE
        """
        result = db.execute_query(query, (user_id,))
        return {"success": True, "data": [dict(r) for r in result]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# STARTUP
# ============================================

@app.on_event("startup")
def startup():
    db.connect()
    logger.info("MindGuard Python Engine started")

@app.on_event("shutdown")
def shutdown():
    db.close()
