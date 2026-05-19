# config/database.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from config.logger import get_logger

load_dotenv()

logger = get_logger(__name__)


class Database:
    def __init__(self):
        self.conn_params = {
            'host':     os.getenv('DB_HOST', 'localhost'),
            'port':     os.getenv('DB_PORT', '5433'),
            'database': os.getenv('DB_NAME', 'mindguard'),
            'user':     os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'MindGuard!'),
        }
        self.conn = None

    def connect(self):
        self.conn = psycopg2.connect(**self.conn_params)
        self.conn.autocommit = False
        logger.info("Connected to PostgreSQL database")
        return self.conn

    def get_connection(self):
        if self.conn is None or self.conn.closed:
            self.connect()
        return self.conn

    def execute_query(self, query, params=None):
        """
        Executa a query com reconexão automática em caso de erro de rede.
        Lança exceção se a query falhar por erro lógico (constraint, etc.).
        """
        for attempt in range(2):
            try:
                conn = self.get_connection()
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    if cursor.description is not None:
                        result = cursor.fetchall()
                        conn.commit()
                        return result
                    conn.commit()
                    return cursor.rowcount

            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                logger.warning("Connection error (attempt %d): %s", attempt + 1, e)
                try:
                    self.conn.rollback()
                except Exception:
                    pass
                self.conn = None
                if attempt == 1:
                    logger.error("Reconnection failed")
                    raise

            except Exception as e:
                try:
                    self.conn.rollback()
                except Exception:
                    pass
                logger.error("Query error: %s", e)
                raise

    def close(self):
        if self.conn and not self.conn.closed:
            self.conn.close()
            logger.info("Database connection closed")


db = Database()
