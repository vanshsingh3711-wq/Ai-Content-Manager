import math
import pytest
from services.subtitle_generator import format_ass_time


def test_zero_and_ordinary_timestamps():
    assert format_ass_time(0.0) == "0:00:00.00"
    assert format_ass_time(1.0) == "0:00:01.00"
    assert format_ass_time(1.5) == "0:00:01.50"
    assert format_ass_time(12.34) == "0:00:12.34"
    assert format_ass_time(65.43) == "0:01:05.43"


def test_fractional_second_rounding():
    assert format_ass_time(0.004) == "0:00:00.00"
    assert format_ass_time(0.005) == "0:00:00.01"
    assert format_ass_time(0.006) == "0:00:00.01"
    assert format_ass_time(0.124) == "0:00:00.12"
    assert format_ass_time(0.126) == "0:00:00.13"


def test_values_around_whole_second_boundary():
    assert format_ass_time(0.994) == "0:00:00.99"
    assert format_ass_time(0.995) == "0:00:01.00"
    assert format_ass_time(1.004) == "0:00:01.00"
    assert format_ass_time(1.006) == "0:00:01.01"


def test_critical_minute_carry_rollover():
    # 59.999 must become 0:01:00.00, NEVER 0:00:60.00
    assert format_ass_time(59.999) == "0:01:00.00"
    assert format_ass_time(59.995) == "0:01:00.00"
    assert format_ass_time(119.999) == "0:02:00.00"
    assert format_ass_time(179.996) == "0:03:00.00"


def test_critical_hour_carry_rollover():
    # 3599.999s is 59m 59.999s -> rounds to exactly 1:00:00.00
    assert format_ass_time(3599.999) == "1:00:00.00"
    assert format_ass_time(3599.995) == "1:00:00.00"
    assert format_ass_time(3600.0) == "1:00:00.00"
    assert format_ass_time(7199.999) == "2:00:00.00"


def test_large_timestamps():
    # 100 hours
    assert format_ass_time(360000.0) == "100:00:00.00"
    # 100 hours 30 mins 45.67s
    assert format_ass_time(361845.67) == "100:30:45.67"


def test_negative_and_invalid_timestamps():
    assert format_ass_time(-0.01) == "0:00:00.00"
    assert format_ass_time(-5.0) == "0:00:00.00"
    assert format_ass_time(None) == "0:00:00.00"
    assert format_ass_time("not-a-number") == "0:00:00.00"
    assert format_ass_time(float("nan")) == "0:00:00.00"
