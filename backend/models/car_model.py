from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class CarModel(Base):
    __tablename__ = "car_models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    make: Mapped[str] = mapped_column(String(255))
    car: Mapped[str] = mapped_column(String(255))
    model: Mapped[float] = mapped_column(Float)
    model_url: Mapped[str] = mapped_column(Text, default="")
