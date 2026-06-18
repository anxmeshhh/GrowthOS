from django.utils.text import slugify


MAX_SLUG_LENGTH = 255


def normalize_slug(value, fallback="item", max_length=MAX_SLUG_LENGTH):
    slug = slugify(value or "")[:max_length].strip("-")
    return slug or fallback[:max_length]


def append_slug_suffix(base_slug, suffix, max_length=MAX_SLUG_LENGTH):
    suffix = f"-{suffix}"
    return f"{base_slug[:max_length - len(suffix)].rstrip('-')}{suffix}"


def unique_slug(model, value, fallback="item", field_name="slug", queryset=None, max_length=MAX_SLUG_LENGTH):
    queryset = queryset if queryset is not None else model.objects.all()
    base_slug = normalize_slug(value, fallback=fallback, max_length=max_length)
    slug = base_slug
    counter = 1

    while queryset.filter(**{field_name: slug}).exists():
        slug = append_slug_suffix(base_slug, counter, max_length=max_length)
        counter += 1

    return slug


def unique_slug_in_memory(value, existing_slugs, fallback="item", max_length=MAX_SLUG_LENGTH):
    base_slug = normalize_slug(value, fallback=fallback, max_length=max_length)
    slug = base_slug
    counter = 1

    while slug in existing_slugs:
        slug = append_slug_suffix(base_slug, counter, max_length=max_length)
        counter += 1

    existing_slugs.add(slug)
    return slug
