from models.ai_event import AIRecommendationEvent
from models.car_model import CarModel
from models.order import Order, OrderItem
from models.otp import PasswordOtp, SignupOtp
from models.product import Product
from models.review import Review
from models.saved_build import SavedBuild
from models.user import User
from models.wishlist import Wishlist

__all__ = [
    "User",
    "Product",
    "Order",
    "OrderItem",
    "Review",
    "CarModel",
    "PasswordOtp",
    "SignupOtp",
    "Wishlist",
    "AIRecommendationEvent",
    "SavedBuild",
]
