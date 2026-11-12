#!/usr/bin/perl
# Writes the shared parts in _partials/ into every page between <!-- @name --> and <!-- @/name --> markers
# (add " abs" to the opening marker for root-absolute paths), then stamps a content-hash ?v= on the local css/js.
use strict;
use warnings;
use Digest::SHA qw(sha1_hex);
use File::Basename qw(dirname);

chdir(dirname(__FILE__) . '/..') or die "chdir: $!";

sub slurp {
    my ($path, $layer) = @_;
    open my $fh, "<$layer", $path or die "$path: $!";
    local $/;
    my $s = <$fh>;
    close $fh;
    return $s;
}

sub absolutize {
    my $s = shift;
    $s =~ s{((?:href|src)=")(?!https?:|mailto:|/|\#)([^"]*)"}{$1/$2"}g;
    $s =~ s{href="/index\.html"}{href="/"}g;
    return $s;
}

sub latest_target {
    my ($best_key, $best_target) = ('', 'index.html');
    for my $page (qw(room music words academia ranournal dispatches)) {
        next unless -f "$page.html";
        my $s = slurp("$page.html", ':encoding(UTF-8)');
        $s =~ s/<!--.*?-->//gs;
        while ($s =~ m{<div class="media-post"(?: id="([^"]+)")?(?: data-t="(\d\d:\d\d)")?>\s*<div class="media-meta">\s*<span class="media-date">(\d{4}-\d{2}-\d{2})</span>}g) {
            my ($id, $time, $date) = ($1, $2, $3);
            my $key = $date . ' ' . (defined $time ? $time : '00:00');
            next unless $key gt $best_key;
            ($best_key, $best_target) = ($key, "$page.html" . (defined $id ? "#$id" : ''));
        }
    }
    return $best_target;
}

my %part;
for my $name (qw(head nav footer phoneblock)) {
    my $s = slurp("_partials/$name.html", ':encoding(UTF-8)');
    $s =~ s/\n*\z/\n/;
    $part{$name} = $s;
}

my $latest = latest_target();

my %hash;
for my $f (qw(styles.css section-progress.js cv-viewer.js)) {
    $hash{$f} = substr(sha1_hex(slurp($f, ':raw')), 0, 8) if -f $f;
}

for my $page (glob '*.html') {
    my $old = slurp($page, ':encoding(UTF-8)');
    my $new = $old;
    for my $name (keys %part) {
        $new =~ s{(<!-- \@\Q$name\E( abs)? -->\n).*?(<!-- \@/\Q$name\E -->)}{
            my ($open, $abs, $close) = ($1, $2, $3);
            $open . ($abs ? absolutize($part{$name}) : $part{$name}) . $close
        }se;
    }
    $new =~ s{(<a class="home-logo-link" href=")[^"]*(")}{$1$latest$2};
    for my $f (keys %hash) {
        $new =~ s{((?:href|src)="/?\Q$f\E)(?:\?v=[A-Za-z0-9]*)?"}{$1?v=$hash{$f}"}g;
    }
    next if $new eq $old;
    open my $fh, '>:encoding(UTF-8)', $page or die "$page: $!";
    print $fh $new;
    close $fh;
}
